# config valid only for Capistrano 3.1
#lock '3.19'

set :application, 'bemused'
set :repo_url, 'git@github.com:pfarrell/bemused.git'
#set :rvm_ruby_string, :local

# Default branch is :master
ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/var/www/bemused'
#set :rvm_map_bins, %w{bundle gem rake ruby}
#set :rvm_type, :auto

set :npm_flags, '--production=false --silent'
set :npm_roles, :web
set :default_env, {
  'PATH' => '$HOME/.nvm/versions/node/v18.17.0/bin:$PATH'
}


# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
set :log_level, :debug

# Default value for :pty is false
set :pty, true
set :deploy_via, :remote_cache

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
 set :linked_dirs, %w{log tmp public/tmp public/images public/mp3s}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

#set :default_env, {
#  'PATH' => "/home/pfarrell/.rvm/rubies/ruby-2.6.5/bin:/home/pfarrell/.rvm/gems/ruby-2.6.5@global/bin:/home/pfarrell/.rvm/bin:$PATH",
#  'RUBY_VERSION' => 'ruby-2.6.5',
#  'GEM_HOME' => '/home/pfarrell/.rvm/gems/ruby-2.6.5.0@global',
#  'GEM_PATH' => '/home/pfarrell/.rvm/gems/ruby-2.6.5.0@global'
#}

# Default value for keep_releases is 5
# set :keep_releases, 5

after 'npm:install', 'react-build'

namespace :react do
  desc 'Build React bundle'
  task :build do
    on roles(:web) do
      within release_path do
        execute :npm, 'run build'
      end
    end
  end
end

namespace :deploy do

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      # Your restart mechanism here, for example:
      execute :touch, release_path.join('tmp/restart.txt')
    end
  end

  after :publishing, :restart

  after :restart, :clear_cache do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
      # Here we can do anything such as:
      # within release_path do
      #   execute :rake, 'cache:clear'
      # end
    end
  end

end
